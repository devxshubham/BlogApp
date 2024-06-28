import { Hono } from "hono";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
  };
}>();

app.post("/api/v1/user/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body: { password: string; username: string } = await c.req.json();
  console.log(body);


  try {
    const user = await prisma.user.create({
      data: {
        username: body.username,
        password: body.password,
      },
    });
    console.log(user);

    return c.text("jwt here");
  } catch (e) {
    console.log(e);
    return c.json(403);
  }
});

app.post("/api/v1/user/signin", (c) => {
  return c.text("user signin");
});

app.get("/api/v1/blog/:id", (c) => {
  const id = c.req.param("id");
  console.log(id);
  return c.text("get blog route");
});

app.post("/api/v1/blog", (c) => {
  return c.text("signin route");
});

app.put("/api/v1/blog", (c) => {
  return c.text("signin route");
});

export default app;
