// src/pages/EngineerDashboard.tsx
import React, { useEffect, useState } from "react";
import apiClient from "../api/appClient";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

type Assignment = {
  _id: string;
  projectId: { _id: string; name: string };
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
};

const EngineerDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user)!;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [capacity, setCapacity] = useState<{
    totalAllocated: number;
    availableCapacity: number;
  }>({ totalAllocated: 0, availableCapacity: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssignmentsAndCapacity = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/assignments");
        setAssignments(res.data);

        const capRes = await apiClient.get(`/engineers/${user.id}/capacity`);
        setCapacity({
          totalAllocated: capRes.data.totalAllocated,
          availableCapacity: capRes.data.availableCapacity,
        });
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error("Failed to load assignments or capacity.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignmentsAndCapacity();
  }, [user.id]);

  if (loading) return <p>Loading your assignments…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {user.name} (Engineer)
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">My Capacity</h2>
        <p className="mb-2">
          Total Allocated: {capacity.totalAllocated}%, Available:{" "}
          {capacity.availableCapacity}%
        </p>
        <div className="w-full bg-gray-200 h-4 rounded">
          <div
            className="bg-green-500 h-4 rounded"
            style={{
              width: `${capacity.totalAllocated}%`,
            }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">My Assignments</h2>
        {assignments.length === 0 ? (
          <p>No current assignments.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <div
                key={a._id}
                className="bg-white p-4 rounded shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {a.projectId.name} ({a.role})
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(a.startDate).toLocaleDateString()} –{" "}
                    {new Date(a.endDate).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm">
                  Allocation: {a.allocationPercentage}%
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EngineerDashboard;
