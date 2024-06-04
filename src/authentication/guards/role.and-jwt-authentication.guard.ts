import BoostaRoles from "../../roles/roles.enum";
import { CanActivate, ExecutionContext, mixin, Type } from "@nestjs/common";
import RequestWithUser from "../requestWithUser.interface";
import JwtAuthenticationGuard from "./jwt-authentication.guard";

const RoleAndJWTAuthenticationGuard = (role: BoostaRoles, allowAdmin: boolean = true): Type<CanActivate> => {
    class RoleGuardMixin extends JwtAuthenticationGuard {
        async canActivate(context: ExecutionContext) {
            await super.canActivate(context);
            const request = context.switchToHttp().getRequest<RequestWithUser>();
            const user = request.user
            if (user.role == BoostaRoles.Admin && allowAdmin) return true
            return user?.role.includes(role)
        }
    }
    return mixin(RoleGuardMixin)
}
export default RoleAndJWTAuthenticationGuard;
