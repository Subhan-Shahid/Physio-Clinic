import { Dashboard } from "@/components/Dashboard"

const Index = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
      <p className="text-sm text-muted-foreground">Clinic Management Overview</p>
      <Dashboard />
    </div>
  );
};

export default Index;
