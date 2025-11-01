"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Building, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AcceptInvitationPage() {
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationId) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("employee_invitations")
          .select(`
            *,
            business_accounts (
              business_name,
              subdomain
            )
          `)
          .eq("id", invitationId)
          .eq("status", "pending")
          .single();

        if (error || !data) {
          setError("Invitation not found or already accepted");
        } else {
          setInvitation(data);
        }
      } catch (err) {
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [invitationId]);

  const handleAcceptInvitation = async () => {
    setAccepting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push(`/sign-in?redirect=/accept-invitation?id=${invitationId}`);
        return;
      }

      if (user.email !== invitation.email) {
        toast({
          title: "Email Mismatch",
          description: "Please sign in with the email address that received the invitation",
          variant: "destructive",
        });
        setAccepting(false);
        return;
      }

      const { error: employeeError } = await supabase
        .from("business_employees")
        .insert({
          business_id: invitation.business_id,
          user_id: user.id,
          role: invitation.role,
        });

      if (employeeError) {
        throw employeeError;
      }

      const { error: invitationError } = await supabase
        .from("employee_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitationId);

      if (invitationError) {
        throw invitationError;
      }

      await supabase
        .from("users")
        .update({
          account_type: "employee",
          business_id: invitation.business_id,
          onboarding_complete: true,
        })
        .eq("id", user.id);

      toast({
        title: "Success! 🎉",
        description: `You've joined ${invitation.business_accounts.business_name}`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/sign-in")}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            You're Invited!
          </CardTitle>
          <CardDescription className="text-lg">
            Join {invitation?.business_accounts?.business_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-100">
            <p className="text-sm text-gray-600 mb-2">You've been invited to join:</p>
            <p className="font-bold text-lg text-gray-900">{invitation?.business_accounts?.business_name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Subdomain: {invitation?.business_accounts?.subdomain}.voip.app
            </p>
            <p className="text-sm text-gray-500">Role: {invitation?.role}</p>
          </div>

          <Button
            onClick={handleAcceptInvitation}
            disabled={accepting}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-lg"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Accept Invitation
              </>
            )}
          </Button>

          <p className="text-center text-sm text-gray-500">
            By accepting, you'll be able to access the business dashboard and collaborate with your team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
