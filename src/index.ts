import { Hono } from "hono";
import { decode, sign, verify } from "hono/jwt";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();

app.use("/user/*", async (c, next) => {
  const tokenToVerify: string = c.req.header("authorization");

  const body: {
    password: string;
    username: string;
    name: string;
    email: string;
  } = await c.req.json();

  if (tokenToVerify) {
    try {
      const decodedPayload = await verify(tokenToVerify, c.env?.JWT_SECRET);
      return c.text("logged in");
    } catch (e) {
      console.log(e);
      const payload = {
        sub: body.username,
        role: "admin",
        exp: Math.floor(Date.now() / 1000) + 60 * 5, // Token expires in 5 minutes
      };

      const token = await sign(payload, c.env?.JWT_SECRET);
      return c.text(`new jwt is ${token}`);
    }
  }
  await next()
});

app.post("/user/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body: {
    password: string;
    username: string;
    name: string;
    email: string;
  } = await c.req.json();

  const newUser = await prisma.user.create({
    data : {
      username : body.username,
      password : body.password,
      email : body.email,
      name : body.name
    },
    select : {
      username : true,
      email : true,
    }
  })
  return c.json(newUser)

  
});

app.post("/user/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (!user) {
    c.status(403);
    return c.json({ error: "user not found" });
  }

  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
  return c.json({ jwt });
});

app.get("/blog/:id", (c) => {
  const id = c.req.param("id");
  console.log(id);
  return c.text("get blog route");
});

app.post("/blog", (c) => {
  return c.text("signin route");
});

app.put("/blog", (c) => {
  return c.text("signin route");
});

export default app;
