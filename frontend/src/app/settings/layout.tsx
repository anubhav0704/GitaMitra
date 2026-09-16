import Navbar from "../../components/Navbar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
