export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] bg-auth-bg">
      <div className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] p-[56px_60px] text-white">
        <div className="absolute -top-[140px] -right-[120px] h-[420px] w-[420px] rounded-full bg-white/[0.12]" />
        <div className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10" />

        <div className="relative flex items-center gap-[13px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/[0.22]">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </div>
          <span className="font-display text-[21px] font-semibold tracking-[0.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="mb-[18px] font-display text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="max-w-[430px] text-[17px] leading-[1.6] text-white/[0.92]">
            Publicá momentos, gestioná las salas y mantené a las familias cerca,
            desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-white/90">
          🌿 Guardería Sala Soles
        </div>
      </div>

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]" />
      </div>
    </div>
  );
}
