"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { SaveDTO } from "@/service/generated";

type RegisterContextType = {
  registerData: SaveDTO;
  updateRegisterData: (data: Partial<SaveDTO>) => void;
  resetRegisterData: () => void;
};

const initialState: SaveDTO = {
  name: "",
  nickName: "",
  loginId: "",
  password: "",
  rePassword: "",
  phoneNumber: "",
  gender: undefined,
  birth: "",
  date: "",
  addressNumber: "",
  address: "",
  addressDetail: "",
  agreedTermsIds: [],
};

const RegisterContext = createContext<RegisterContextType | null>(null);

export function RegisterProvider({ children }: { children: ReactNode }) {
  const [registerData, setRegisterData] = useState<SaveDTO>(initialState);

  const updateRegisterData = (data: Partial<SaveDTO>) => {
    setRegisterData((prev) => ({ ...prev, ...data }));
  };

  const resetRegisterData = () => {
    setRegisterData(initialState);
  };

  return (
    <RegisterContext.Provider
      value={{
        registerData,
        updateRegisterData,
        resetRegisterData,
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
}

export function useRegister() {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error("useRegister must be used within RegisterProvider");
  }
  return context;
}
