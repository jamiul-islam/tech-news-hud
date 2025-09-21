export const LoadingIndicator = () => (
  <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0b0b0b]/80 via-[#0b0b0b]/70 to-[#0b0b0b]/90 backdrop-blur-sm">
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 animate-[ping_1.2s_ease-in-out_infinite] rounded-full border-2 border-[#4C7EFF]/40" />
      <div className="absolute inset-2 animate-[spin_1.4s_linear_infinite] rounded-full border-2 border-[#4C7EFF] border-t-transparent" />
      <div className="absolute inset-4 rounded-full bg-[#4C7EFF] opacity-80" />
    </div>
  </div>
);

