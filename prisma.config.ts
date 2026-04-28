const prismaConfig = {
  schema: "./prisma/schema.prisma",
  datasource: {
    db: {
      provider: "postgresql",
      url: process.env.DATABASE_URL,
    },
  },
};

export default prismaConfig;
