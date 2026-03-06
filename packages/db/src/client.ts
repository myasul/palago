export const createDbClient = () => {
  return {
    url: process.env.DATABASE_URL ?? "",
  };
};
