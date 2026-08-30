export const INVITE_COOKIE='konki_family_invite';
export function cookieValue(request:Request,name=INVITE_COOKIE){const header=request.headers.get('cookie')||'';for(const part of header.split(';')){const[index,value]=part.trim().split('=');if(index===name)return decodeURIComponent(value||'')}return''}
export function inviteCookie(token:string,maxAge=60*60*24){return`${INVITE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`}
export function clearInviteCookie(){return`${INVITE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`}
