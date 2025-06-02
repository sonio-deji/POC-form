import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { NotfoundError, RequiredParameterError } from "../../errors/appError";
import { Page } from "@prisma/client";
import UAParser from "ua-parser-js";
import axios from "axios";
import lookup from "geoip-lite";

const publicWebsite = Router();

publicWebsite.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path, url } = req.query;
      // console.log(url);
      // if (!url) {
      //   throw new RequiredParameterError("Url");
      // }

      const website = await prisma.website.update({
        where: {
          url: req.query.url as string,
        },
        data: {
          urlVisits: {
            increment: 1,
          },
        },
        select: {
          name: true,
          page: true,
          header: true,
          footer: true,
          content: true,
          favicon: true,
          description: true,
          published: true,
          business: {
            select: {
              form: {
                select: {
                  fields: true,
                },
              },
            },
          },
          id: true,
        },
      });

      if (!website.published) {
        throw new NotfoundError("resource");
      }
      const page = await prisma.page.update({
        where: {
          slug_websiteId: {
            slug: !path ? "/" : (path as string),
            websiteId: website.id,
          },
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });
      // if (!page) {
      //   throw new NotfoundError("page");
      // }
      await prisma.page.update({
        where: {
          id: page.id,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });
      const parser = UAParser;
      const ua = parser.UAParser(req.headers["user-agent"]).browser;
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      const location = lookup.lookup(ip as string);
      const { country, region, city, timezone } = location;
      await prisma.$transaction(async (tx) => {
        // Upsert analytics
        await tx.analytics.upsert({
          where: { websiteId: website.id },
          update: {
            urlVisits: { increment: 1 },
          },
          create: {
            websiteId: website.id,
            urlVisits: 1,
          },
        });

        // Increment browser usage or create new
        await tx.visitsByBrowser.upsert({
          where: {
            browser_analyticsId: {
              browser: ua.name ?? "Unknown",
              analyticsId: website.id,
            },
          },
          update: {
            count: { increment: 1 },
          },
          create: {
            browser: ua.name ?? "Unknown",
            count: 1,
            analyticsId: website.id,
          },
        });
        await tx.visitsByLocation.upsert({
          where: {
            country_region_city_timezone_analyticsId: {
              country,
              region,
              city,
              timezone,
              analyticsId: website.id,
            },
          },
          update: {
            count: { increment: 1 },
          },
          create: {
            country,
            region,
            city,
            timezone,
            count: 1,
            analyticsId: website.id,
          },
        });
      });
      const { views, ...filteredPage } = page;
      const { published, ...filteredWebsite } = website;
      res.json({
        message: "website retrieved",
        website: filteredWebsite,
        page: filteredPage,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default publicWebsite;
