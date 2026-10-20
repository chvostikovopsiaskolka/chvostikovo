    let refreshFlightV323=null;
    async function refresh(){
      if(refreshFlightV323)return refreshFlightV323;
      if(!session?.refresh_token)return false;
      const previous=session;
      refreshFlightV323=(async()=>{
        try{
          const r=await fetch(baseUrl+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:previous.refresh_token})});
          const j=await r.json().catch(()=>({}));
          // A response from an older refresh must not clear a subsequent login.
          if(session?.refresh_token!==previous.refresh_token)return !!session?.access_token;
          if(!r.ok){if(r.status===400||r.status===401){save(null);notify('SIGNED_OUT')}return false}
          if(!j.access_token||!j.refresh_token)return false;
          save(j);notify('TOKEN_REFRESHED');return true;
        }catch(_){return false}
        finally{refreshFlightV323=null}
      })();
      return refreshFlightV323;
    }
