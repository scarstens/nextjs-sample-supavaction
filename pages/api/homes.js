import { PrismaClient } from "@prisma/client";

const db_prisma = new PrismaClient();

export default async function handler(req, res) {
  // Create new home
  if (req.method === "POST") {
    try {
      const { image, title, description, price, guests, beds, baths } =
        req.body;
      const home = await db_prisma.home.create({
        data: { image, title, description, price, guests, beds, baths },
      });

      return res.status(200).json(home);
    } catch (e) {
      res.status(500).json({
        message: "Something went wrong on the server, please try again.",
      });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["POST"]);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}