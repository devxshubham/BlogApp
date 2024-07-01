import { Hono } from "hono";
import { sign } from "hono/jwt";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body: {
    password: string;
    username: string;
    name: string;
    email: string;
  } = await c.req.json();

  try {
    const newUser = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
        email: body.email,
        name: body.name,
      },
      select: {
        id : true,
        username: true,
        email: true,
      },
    });
    const payload = {
      id : newUser.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 30, // Token expires in 5 minutes
    };
    const token = await sign(payload, c.env?.JWT_SECRET, "HS256");

    return c.json({ jwt_token: token });
  } catch {
    c.status(403);
    return c.text("invalid");
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const user = await prisma.user.findUnique({
    where: {
      username: body.username,
      password: body.password,
    },
  });

  if (!user) {
    c.status(403);
    return c.json({ error: "user not found" });
  }

  const payload = {
    id: user.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 30, // Token expires in 5 minutes
  };
  const token = await sign(payload, c.env.JWT_SECRET);
  return c.json({ jwt_token: token });
});
