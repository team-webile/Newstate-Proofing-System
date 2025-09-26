"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestToastPage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Toast Test Page</CardTitle>
          <CardDescription>
            Test different types of toasts to verify the system is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => {
              toast({
                title: "Success Toast",
                description: "This is a success message!",
              });
            }}
            className="w-full"
          >
            Success Toast
          </Button>

          <Button
            onClick={() => {
              toast({
                title: "Error Toast",
                description: "This is an error message!",
                variant: "destructive",
              });
            }}
            variant="destructive"
            className="w-full"
          >
            Error Toast
          </Button>

          <Button
            onClick={() => {
              toast({
                title: "Info Toast",
                description: "This is an informational message!",
              });
            }}
            variant="outline"
            className="w-full"
          >
            Info Toast
          </Button>

          <Button
            onClick={() => {
              toast({
                title: "Long Message Toast",
                description:
                  "This is a longer message to test how the toast handles longer content and whether it wraps properly or gets cut off.",
              });
            }}
            variant="secondary"
            className="w-full"
          >
            Long Message Toast
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
