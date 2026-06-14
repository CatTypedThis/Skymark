"use client";

import { useEffect, useState } from "react";
import {
  detectPlatform,
  getDefaultPlatformInfo,
  type PlatformInfo,
} from "@/lib/utils/platform";

export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformInfo>(() => getDefaultPlatformInfo());

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return platform;
}
