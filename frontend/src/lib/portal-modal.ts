import { createContext, type RefObject } from "react";

export const PortalDoModal = createContext<RefObject<HTMLElement | null> | undefined>(undefined);
