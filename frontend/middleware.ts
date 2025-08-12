import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Make the home page public
  publicRoutes: ["/"],
});

export const config = {
  matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
