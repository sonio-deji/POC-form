import prisma from "./prisma";

export async function generateUniqueUrl(base: string): Promise<string> {
  let url = `${base}.fluttersuite.com`;
  let suffix = 1;

  while (true) {
    const existing = await prisma.website.findUnique({ where: { url } });
    if (!existing) break;

    url = `${base}-${suffix}.fluttersuite.com`;
    suffix++;
  }

  return url;
}
