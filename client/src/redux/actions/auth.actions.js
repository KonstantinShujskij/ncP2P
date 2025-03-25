import { LOGIN, LOGOUT } from '../types/auth.types'

export function login(token, userId, access='NONE', isAdmin=false) {    
    return {
        type: LOGIN,
        payload: { token, userId, access, isAdmin }
    }
}

export function logout() {
    return {
        type: LOGOUT
    }
}
