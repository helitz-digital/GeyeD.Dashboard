"use client";

import React, { useState } from "react";
import { useWebhookDeliveries } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";

function formatPayload(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function WebhookDeliveryLog({ appId }: { appId: number }) {
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const { data, isLoading } = useWebhookDeliveries(appId, page);

  const toggleRow = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Log</CardTitle>
        <CardDescription>
          Recent webhook delivery attempts and their results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground animate-pulse py-4">
            Loading deliveries...
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            No deliveries yet. Deliveries will appear here once events are triggered.
          </p>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="w-8" />
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Time
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Event
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Duration
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Attempt
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((delivery) => (
                    <React.Fragment key={delivery.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleRow(delivery.id)}
                      >
                        <TableCell className="w-8 px-2">
                          {expandedIds.has(delivery.id) ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {new Date(delivery.createdAtUtc).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono">{delivery.eventType}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={delivery.success ? "default" : "destructive"}>
                            {delivery.success
                              ? `${delivery.httpStatusCode ?? "OK"}`
                              : delivery.httpStatusCode
                                ? `${delivery.httpStatusCode}`
                                : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {delivery.durationMs}ms
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          #{delivery.attemptNumber}
                        </TableCell>
                      </TableRow>

                      {expandedIds.has(delivery.id) && (
                        <TableRow key={`${delivery.id}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-3">
                              {/* Payload */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  Payload
                                </p>
                                <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 text-xs font-mono max-h-64">
                                  {formatPayload(delivery.payload)}
                                </pre>
                              </div>

                              {/* Error message */}
                              {delivery.errorMessage && (
                                <div>
                                  <p className="text-xs font-semibold text-destructive mb-1">
                                    Error
                                  </p>
                                  <p className="text-sm text-destructive">
                                    {delivery.errorMessage}
                                  </p>
                                </div>
                              )}

                              {/* Response body */}
                              {delivery.responseBody && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                                    Response Body
                                  </p>
                                  <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 text-xs font-mono max-h-40">
                                    {formatPayload(delivery.responseBody)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.totalCount} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasPreviousPage}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
