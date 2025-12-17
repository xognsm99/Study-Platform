 "use client";
 
 import { useEffect } from "react";
 import { useRouter } from "next/navigation";
 import AuthForm from "@/components/AuthForm";
 import { createSupabaseBrowser } from "@/lib/supabase/browser";
 
 export default function AuthPage() {
   const router = useRouter();
   const supabase = createSupabaseBrowser();
 
   useEffect(() => {
     let cancelled = false;
 
     async function checkSession() {
       try {
         const {
           data: { user },
         } = await supabase.auth.getUser();
 
         if (!cancelled && user) {
           router.replace("/");
         }
       } catch (e) {
         console.error("[auth/page] getUser error:", e);
       }
     }
 
     checkSession();
 
     const {
       data: { subscription },
     } = supabase.auth.onAuthStateChange((_event, session) => {
       if (session?.user) {
         router.replace("/");
       }
     });
 
     return () => {
       cancelled = true;
       subscription.unsubscribe();
     };
   }, [router, supabase]);
 
   return (
     <div className="min-h-screen flex items-start justify-center bg-slate-50 px-4 py-10">
       <div className="w-full max-w-md">
         <AuthForm />
       </div>
     </div>
   );
 }
