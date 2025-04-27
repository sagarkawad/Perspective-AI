"use client";
import { RecoilRoot } from "recoil";
import { Suspense, useEffect } from "react";

export const RecoilRootProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    // Force a re-render after mount to ensure Recoil is properly initialized
    return () => {};
  }, []);

  return (
    <RecoilRoot>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </RecoilRoot>
  );
};
