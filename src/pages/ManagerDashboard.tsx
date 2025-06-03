// src/pages/ManagerDashboard.tsx
import React, { useEffect, useState } from "react";
import apiClient from "../api/appClient";
import { useAuthStore } from "../store/useAuthStore";
import CapacityBar from "../components/CapacityBar";
import { format } from "date-fns";

// Recharts imports for the utilization chart
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

type Engineer = {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  seniority: string;
  maxCapacity: number;
  department: string;
};

export interface CapacityResponse {
  totalAllocated: number;
  availableCapacity: number;
}

export const ManagerDashboard: React.FC = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const user = useAuthStore((state) => state.user)!;

  // Map of engineerId → ISO available date string
  const [availabilityMap, setAvailabilityMap] = useState<
    Record<string, string>
  >({});

  // Map of engineerId → utilization percentage (0–100)
  const [utilMap, setUtilMap] = useState<Record<string, number>>({});

  // Search/filter state (by skill)
  const [filterSkill, setFilterSkill] = useState<string>("");

  // 1) Fetch engineers, then availability and capacity for each
  useEffect(() => {
    const fetchEngineers = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<Engineer[]>("/engineers");
        const ingList = res.data;
        setEngineers(ingList);

        // Prepare calls for availability
        const availCalls = ingList.map((eng) =>
          apiClient
            .get<{ availableDate: string }>(
              `/engineers/${eng._id}/availability`
            )
            .then((r) => ({ id: eng._id, date: r.data.availableDate }))
            .catch(() => ({ id: eng._id, date: new Date().toISOString() }))
        );

        // Prepare calls for capacity (to compute utilization)
        const capCalls = ingList.map((eng) =>
          apiClient
            .get<CapacityResponse>(`/engineers/${eng._id}/capacity`)
            .then((r) => ({
              id: eng._id,
              pct: Math.round((r.data.totalAllocated / eng.maxCapacity) * 100),
            }))
            .catch(() => ({ id: eng._id, pct: 0 }))
        );

        const [availResults, capResults] = await Promise.all([
          Promise.all(availCalls),
          Promise.all(capCalls),
        ]);

        // Build availability map
        const newAvailMap: Record<string, string> = {};
        availResults.forEach((r) => {
          newAvailMap[r.id] = r.date;
        });
        setAvailabilityMap(newAvailMap);

        // Build utilization map
        const newUtilMap: Record<string, number> = {};
        capResults.forEach((r) => {
          // clamp between 0–100
          newUtilMap[r.id] = Math.min(Math.max(r.pct, 0), 100);
        });
        setUtilMap(newUtilMap);
      } catch (err) {
        console.error("Error fetching engineers or data:", err);
        toast.error("Failed to load engineers.");
      } finally {
        setLoading(false);
      }
    };

    fetchEngineers();
  }, []);

  // 2) Filter engineers by skill
  const filteredEngineers = engineers.filter((eng) =>
    filterSkill.trim() === ""
      ? true
      : eng.skills.some((skill) =>
          skill.toLowerCase().includes(filterSkill.toLowerCase().trim())
        )
  );

  // 3) Build chart data from utilMap & engineers
  const chartData = engineers.map((eng) => ({
    name: eng.name,
    utilization: utilMap[eng._id] ?? 0,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Welcome, {user.name} (Manager)</h1>

      {/* Analytics: Team Utilization Chart */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Team Utilization</h2>
        {loading ? (
          <p>Loading chart…</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey="utilization" fill="#3182ce" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Search / Filter by Skill */}
      <section className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold mb-2 md:mb-0">Team Overview</h2>
          <input
            type="text"
            placeholder="Filter by skill (e.g. React)"
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border rounded"
          />
        </div>

        {loading ? (
          <p>Loading engineers…</p>
        ) : filteredEngineers.length === 0 ? (
          <p>No engineers match that skill.</p>
        ) : (
          <div className="space-y-4">
            {filteredEngineers.map((eng) => {
              // 1) Decide availabilityText by checking utilPct first
              let availabilityText = "—";
              const utilPct = utilMap[eng._id] ?? 0;
              if (utilPct < 100) {
                availabilityText = "Today";
              } else {
                const rawDate = availabilityMap[eng._id];
                if (rawDate) {
                  availabilityText = format(new Date(rawDate), "MMM d, yyyy");
                }
              }

              return (
                <div
                  key={eng._id}
                  className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:justify-between md:items-center"
                >
                  <div>
                    <p className="font-medium text-lg">
                      {eng.name}{" "}
                      <span className="text-sm text-gray-500">
                        ({eng.department})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Skills: {eng.skills.join(", ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Seniority:{" "}
                      {eng.seniority.charAt(0).toUpperCase() +
                        eng.seniority.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Available:{" "}
                      <span className="font-semibold">{availabilityText}</span>
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <CapacityBar
                      engineerId={eng._id}
                      maxCapacity={eng.maxCapacity}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ManagerDashboard;
