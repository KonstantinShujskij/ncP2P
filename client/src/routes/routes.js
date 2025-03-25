import notAuthRoutes from './notAuth.routes'
import adminRoutes from './admin.routes'
import makerRoutes from './maker.routes'
import supportRoutes from './support.routes'


export const useRoutes = (isAuth, access='NONE') => {    
    if(isAuth && access === 'SUPPORT') { return supportRoutes }
    if(isAuth && access === 'MAKER') { return makerRoutes }
    if(isAuth && access === 'ADMIN') { return adminRoutes }

    return notAuthRoutes 
}