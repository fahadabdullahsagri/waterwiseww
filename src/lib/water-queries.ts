import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getHouseholdId } from "./household";
import {
  addHouseholdEntry,
  listHouseholdEntries,
  seedHouseholdHistory,
} from "./household.functions";
import type { Entry } from "./water";

/** The household id only exists in the browser, so it resolves after hydration. */
export function useHouseholdId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(getHouseholdId()), []);
  return id;
}

export function useWaterEntries(householdId: string | null) {
  return useQuery({
    queryKey: ["household-entries", householdId],
    enabled: !!householdId,
    queryFn: async () => {
      await seedHouseholdHistory({ data: { householdId: householdId! } });
      return (await listHouseholdEntries({
        data: { householdId: householdId! },
      })) as unknown as Entry[];
    },
  });
}

export function useAddEntry(householdId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      entryDate: string;
      litres: number;
      category: "household" | "garden" | "livestock" | "other";
      note?: string;
      isDemo?: boolean;
    }) => addHouseholdEntry({ data: { householdId: householdId!, ...input } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["household-entries", householdId] }),
  });
}
