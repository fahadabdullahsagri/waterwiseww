import { queryOptions } from "@tanstack/react-query";
import {
  getCitizen,
  getGov,
  getIrrigation,
  getMetrics,
  getOperator,
} from "./waterwise.functions";

export const operatorQuery = queryOptions({
  queryKey: ["operator"],
  queryFn: () => getOperator(),
  refetchInterval: 4000,
});

export const citizenQuery = queryOptions({
  queryKey: ["citizen"],
  queryFn: () => getCitizen(),
  refetchInterval: 4000,
});

export const govQuery = queryOptions({
  queryKey: ["gov"],
  queryFn: () => getGov(),
  refetchInterval: 6000,
});

export const metricsQuery = queryOptions({
  queryKey: ["metrics"],
  queryFn: () => getMetrics(),
  refetchInterval: 6000,
});

export const irrigationQuery = (districtId?: string) =>
  queryOptions({
    queryKey: ["irrigation", districtId ?? "default"],
    queryFn: () => getIrrigation({ data: { districtId } }),
    staleTime: 60_000,
  });
