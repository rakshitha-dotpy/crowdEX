import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users as UsersIcon, Shield, User, Loader2 } from "lucide-react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface UserDoc {
  id: string;
  email?: string;
  displayName?: string;
  role: "user" | "admin";
  createdAt?: unknown;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const list: UserDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          email: d.data().email,
          displayName: d.data().displayName,
          role: d.data().role === "admin" ? "admin" : "user",
          createdAt: d.data().createdAt,
        }));
        setUsers(list);
      } catch (e) {
        toast({
          title: "Failed to load users",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const setRole = async (uid: string, role: "user" | "admin") => {
    setUpdatingId(uid);
    try {
      await updateDoc(doc(db, "users", uid), { role });
      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, role } : u))
      );
      toast({
        title: role === "admin" ? "User is now an admin" : "Admin role removed",
      });
    } catch (e) {
      toast({
        title: "Failed to update role",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <UsersIcon className="w-6 h-6" />
          Users
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View all users and promote or remove admin access.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <motion.div
          className="glass-card overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Display name</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isCurrentUser = currentUser?.uid === u.id;
                    const isUpdating = updatingId === u.id;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="p-4">
                          {u.email || <span className="text-muted-foreground">No email</span>}
                        </td>
                        <td className="p-4">
                          {u.displayName || (
                            <span className="text-muted-foreground font-mono text-xs">
                              {u.id.slice(0, 8)}…
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {u.role === "admin" ? (
                            <Badge variant="secondary" className="gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <User className="w-3 h-3" />
                              User
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {u.role === "user" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={isUpdating}
                              onClick={() => setRole(u.id, "admin")}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Make admin"
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isCurrentUser || isUpdating}
                              onClick={() => setRole(u.id, "user")}
                              title={
                                isCurrentUser
                                  ? "You cannot remove your own admin role"
                                  : undefined
                              }
                            >
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Remove admin"
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
