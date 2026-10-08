export async function localRequest(path, method='GET', body) {
  const response=await fetch(`/api/local-account/${path}`,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  const data=await response.json();
  if(!response.ok) throw Object.assign(Error(data.message),{code:data.code,status:response.status});
  return data;
}
const listeners=new Set();
export const localClient={auth:{
  async getUser(){return {data:await localRequest('session')};},
  async signInWithPassword(credentials){
    try {const data=await localRequest('login','POST',credentials); listeners.forEach(fn=>fn('SIGNED_IN',data));return {data};} catch(error){return {error};}
  },
  async signOut(){
    try {await localRequest('logout','POST');listeners.forEach(fn=>fn('SIGNED_OUT',null));return {};}catch(error){return {error};}
  },
  onAuthStateChange(fn){listeners.add(fn); return {data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}};},
}};
