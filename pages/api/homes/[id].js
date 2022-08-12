import { getSession } from "next-auth/react";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Check if user is authenticated
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  // Retrieve the authenticated user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { listedHomes: true },
  });
  console.log("Session user has these homes", user.listedHomes);
  // Check if authenticated user is the owner of this home
  const { id } = req.query;
  // TODO: Fix query to only return the 1 home instead of all homes.
  if (!user?.listedHomes?.find((home) => home.id === id)) {
    console.log("User is not allowed to edit this home.");
    return res.status(401).json({ message: "Unauthorized." });
  }
  // Update home
  if (req.method === "PATCH") {
    try {
      const home = await prisma.home.update({
        where: { id },
        data: req.body,
      });
      res.status(200).json(home);
    } catch (e) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  // Delete home
  else if (req.method === "DELETE") {
    try {
      const home = await prisma.home.delete({
        where: { id },
      });
      // Remove image from Supabase storage
      if (home.image) {
        const path = home.image.split(`${process.env.SUPABASE_BUCKET}/`)?.[1];
        await supabase.storage.from(process.env.SUPABASE_BUCKET).remove([path]);
      }
      res.status(200).json(home);
    } catch (e) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["PATCH", "DELETE"]);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}
