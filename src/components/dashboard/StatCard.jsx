export default function StatCard({ title, value }) {
  return (
    <div className="
      bg-[#ededed]
      p-4 sm:p-5 lg:p-6
      rounded-xl
      shadow-sm hover:shadow-md
      transition
      w-full
    ">
      <p className="
        text-gray-500
        text-xs sm:text-sm lg:text-base
        truncate
      ">
        {title}
      </p>

      <h2 className="
        font-bold
        mt-2
        text-lg sm:text-2xl lg:text-3xl
        wrap-break-word
      ">
        {value}
      </h2>
    </div>
  );
}