// src/components/CapacityBar.tsx
import React, { useEffect, useState } from "react";
import apiClient from "../api/appClient";

interface CapacityBarProps {
  engineerId: string;
  maxCapacity: number;
}

const CapacityBar: React.FC<CapacityBarProps> = ({
  engineerId,
  maxCapacity,
}) => {
  const [allocation, setAllocation] = useState<number>(0);

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const res = await apiClient.get(`/engineers/${engineerId}/capacity`);
        setAllocation(res.data.totalAllocated);
      } catch (err) {
        console.error("Error fetching capacity for", engineerId, err);
      }
    };
    fetchCapacity();
  }, [engineerId]);

  const percentage = Math.min(
    Math.round((allocation / maxCapacity) * 100),
    100
  );

  return (
    <div className="w-48">
      <div className="w-full bg-gray-200 h-4 rounded mb-1">
        <div
          className={`h-4 rounded ${
            percentage > 80
              ? "bg-red-500"
              : percentage > 50
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 text-right">
        {allocation}/{maxCapacity}
      </p>
    </div>
  );
};

export default CapacityBar;
