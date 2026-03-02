import { Nav } from "../components/Nav";
import "./tailwind.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className={"min-h-screen bg-base-100 text-base-content flex flex-col"}>
      <Nav/>
      <div className={"container m-auto mt-4"}>
        <Content>{children}</Content>
      </div>
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4">
      {children}
    </div>
  );
}
