"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import LoginForm from "./LoginForm.tsx";
import LoginHero from "./LoginHero";
import LoginIntro from "./LoginIntro";
import RegisterForm from "./RegisterForm.tsx";

export default function AuthView() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <main className="min-h-[75svh] bg-[#f8f9ff] px-5 py-8 text-[#17243d] sm:px-8 sm:py-12 md:flex md:items-center md:justify-center md:px-10 xl:bg-[linear-gradient(135deg,#f8f9ff_0%,#eef4ff_55%,#e8fbfa_100%)] xl:px-0">
      <div
        className="w-full max-w-[1080px] md:flex md:min-h-[36rem] md:flex-col md:overflow-hidden md:rounded-[1.25rem] md:bg-white md:shadow-[0_24px_70px_rgba(38,47,99,0.14)] xl:max-w-[960px] xl:rounded-[0.75rem]"
      >
        <div className="flex justify-center pb-8 md:hidden">
          <BrandMark compact />
        </div>
        <LayoutGroup>
          <div
            className={`md:flex-1 ${
              isRegistering
                ? "md:grid-cols-[1.08fr_0.92fr]"
                : "md:grid-cols-[0.92fr_1.08fr]"
            } md:grid`}
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className={`h-full ${isRegistering ? "md:order-2" : "md:order-1"}`}
            >
              <LoginHero isRight={isRegistering} />
            </motion.div>
            <motion.section
              layout
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className={`mx-auto min-w-0 w-full max-w-[540px] md:max-w-none md:px-10 md:py-12 xl:px-8 xl:py-8 ${
                isRegistering ? "md:order-1" : "md:order-2"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isRegistering ? (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <LoginIntro registering />
                    <RegisterForm onLoginClick={() => setIsRegistering(false)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                  >
                    <LoginIntro />
                    <LoginForm onRegisterClick={() => setIsRegistering(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>
        </LayoutGroup>
      </div>
    </main>
  );
}
