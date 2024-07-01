import { Hono } from "hono";
import { sign, verify } from "hono/jwt";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  Variables : {
    userId : string;
  }
  
}>();

blogRouter.use("/*", async (c, next) => {
    const tokenToVerify = c.req.header("authorization") || ""

    try{
        const checkVerify = await verify(tokenToVerify,c.env.JWT_SECRET,"HS256") 
        c.set('userId',checkVerify.id)
        await next();
    }
    catch{
        return c.text("login first")
    }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const authorId  = c.get("userId")

  const body = await c.req.json();

  try {
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        published: body.published,
        authorId: authorId,
      },
      select : {
        id : true,
      }
    });
    return c.json(post);
  } catch {
    return c.text("invalid");
  }
});

blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const updatadBlog = await prisma.post.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return c.text("user Updated");
  } catch {
    return c.text("invalid updation");
  }
});



blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogs = await prisma.post.findMany({});

  return c.json(blogs)
});

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const id = c.req.param("id");
  console.log(id);

  const body = await c.req.json();

  try {
    const findPost = await prisma.post.findUnique({
      where: {
        id: body.id,
      },
      select: {
        title: true,
        content: true,
        authorId: true,
      },
    });

    return c.text("post found");
  } catch {
    return c.text("post cannot be found");
  }
});