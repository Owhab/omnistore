import { Routes } from "@nestjs/core";
import { AuthModule } from "./modules/auth/auth.module";
import { ProfileModule } from "./modules/profile/profile.module";

const routes: Routes = [
  {
    path: "auth",
    module: AuthModule,
  },
  {
    path: "profile",
    module: ProfileModule,
  },
];

export default routes;
