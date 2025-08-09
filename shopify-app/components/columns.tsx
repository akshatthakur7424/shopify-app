"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { FormattedOrder } from "@/app/context/orderDataContextProvider";
import { useRouter } from "next/navigation";

export const columns: ColumnDef<FormattedOrder>[] = [
    {
        accessorKey: "email",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Customer Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
    },
    {
        accessorKey: "totalAmount",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Total Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const amount = row.getValue<number>("totalAmount") || 0;
            return <span className="text-sm font-medium">${amount.toFixed(2)}</span>;
        },
    },
    {
        accessorKey: "shippingAddress",
        header: "Shipping Address",
        cell: ({ row }) => {
            const address = row.getValue<string>("shippingAddress") || "N/A";
            return <span className="truncate">{address}</span>;
        },
    },
    {
        accessorKey: "fulfillments",
        header: "Fulfillment Status",
        cell: ({ row }) => {
            const fulfillments = row.getValue<{ id: string; status: string }[]>(
                "fulfillments"
            );
            if (!fulfillments?.length) {
                return <Badge className="bg-slate-500">Unfulfilled</Badge>;
            }
            return (
                <Badge
                    className={`${fulfillments[0].status === "SUCCESS"
                        ? "bg-green-600"
                        : "bg-yellow-600"
                        }`}
                >
                    {fulfillments[0].status}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: "Manage",
        cell: ({ row }) => {
            const order = row.original;
            const router = useRouter();
            return (
                <Button
                    variant="outline"
                    className="cursor-pointer"
                    size="sm"
                    onClick={() => router.push(`/order-details/${encodeURIComponent(order.id)}`)}
                >
                    View
                </Button >
            );
        },
    },
];
