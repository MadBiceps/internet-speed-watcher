declare module "speedtest-net" {
  interface SpeedTestResult {
    timestamp: Date;
    ping: { jitter: number; latency: number };
    download: { bandwidth: number; bytes: number; elapsed: number };
    upload: { bandwidth: number; bytes: number; elapsed: number };
    packetLoss?: number;
    isp: string;
    interface: {
      internalIp: string;
      name: string;
      macAddr: string;
      isVpn: boolean;
      externalIp: string;
    };
    server: {
      id: number;
      name: string;
      location: string;
      country: string;
      host: string;
      port: number;
      ip: string;
    };
    result: { id: string; url: string };
  }

  interface SpeedTestOptions {
    acceptLicense?: boolean;
    acceptGdpr?: boolean;
    serverId?: string;
    sourceIp?: string;
    host?: string;
    binary?: string;
    binaryVersion?: string;
    progress?: (data: unknown) => void;
    cancel?: (
      setCancelHandler: unknown,
      abort: () => void,
    ) => boolean | void;
    verbosity?: number;
  }

  function speedTest(options?: SpeedTestOptions): Promise<SpeedTestResult>;
  export default speedTest;
}
