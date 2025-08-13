import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)", "/search(.*)"],
  ignoredRoutes: ["/api/webhooks(.*)"]
});

export const config = {
  matcher: ["/((?!.+\.[\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

