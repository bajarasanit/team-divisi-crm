import { useState } from "react";
import { CRMLayout } from "@/components/CRMLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, Plus, Clock, AlertTriangle } from "lucide-react";
import { useInteractions } from "@/hooks/useInteractions";
import { useCustomers } from "@/hooks/useCustomers";
import { AddInteractionForm } from "@/components/AddInteractionForm";
import { InteractionCard } from "@/components/InteractionCard";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Interaction } from "@/hooks/useInteractions";

const Followups = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [deletingInteraction, setDeletingInteraction] = useState<Interaction | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  
  const { interactions, loading, createInteraction, updateInteraction, deleteInteraction, markAsCompleted } = useInteractions();
  const { customers } = useCustomers();
  
  // Filter interactions to show only pending and overdue follow-ups
  const followupInteractions = interactions.filter(interaction => 
    (interaction.type === 'followup' || interaction.due_date) &&
    interaction.status !== 'done'
  );

  const filteredInteractions = followupInteractions.filter(interaction => {
    const customer = customers.find(c => c.id === interaction.customer_id);
    const customerName = customer?.name || '';
    return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           interaction.notes.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Separate overdue and upcoming
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueInteractions = filteredInteractions.filter(interaction => {
    if (!interaction.due_date) return false;
    const dueDate = new Date(interaction.due_date);
    return dueDate < today;
  });

  const upcomingInteractions = filteredInteractions.filter(interaction => {
    if (!interaction.due_date) return false;
    const dueDate = new Date(interaction.due_date);
    return dueDate >= today;
  });

  const handleAddInteraction = async (data: Omit<Interaction, 'id' | 'created_at' | 'updated_at'>) => {
    await createInteraction(data);
    setShowAddForm(false);
    setSelectedCustomerId("");
  };

  const handleEditInteraction = async (data: Omit<Interaction, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingInteraction) {
      await updateInteraction(editingInteraction.id, data);
      setEditingInteraction(null);
    }
  };

  const handleDeleteInteraction = async () => {
    if (deletingInteraction) {
      await deleteInteraction(deletingInteraction.id);
      setDeletingInteraction(null);
    }
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Follow-ups</h1>
            <p className="text-muted-foreground">Manage your scheduled follow-ups and interactions</p>
          </div>
          <Button className="flex items-center gap-2" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Add Follow-up
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search follow-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueInteractions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingInteractions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followupInteractions.length}</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue Section */}
            {overdueInteractions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Overdue Follow-ups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {overdueInteractions.map((interaction) => (
                      <div key={interaction.id} className="relative">
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        </div>
                        <InteractionCard
                          interaction={interaction}
                          onEdit={setEditingInteraction}
                          onDelete={setDeletingInteraction}
                          onMarkCompleted={markAsCompleted}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Section */}
            {upcomingInteractions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Follow-ups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {upcomingInteractions.map((interaction) => (
                      <InteractionCard
                        key={interaction.id}
                        interaction={interaction}
                        onEdit={setEditingInteraction}
                        onDelete={setDeletingInteraction}
                        onMarkCompleted={markAsCompleted}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {filteredInteractions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No follow-ups found matching your search." : "No pending follow-ups. Great job staying on top of things!"}
                  </p>
                  {!searchTerm && (
                    <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Follow-up
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <AddInteractionForm
          open={showAddForm}
          onOpenChange={(open) => {
            setShowAddForm(open);
            if (!open) setSelectedCustomerId("");
          }}
          onSubmit={handleAddInteraction}
          customerId={selectedCustomerId}
        />

        <AddInteractionForm
          open={!!editingInteraction}
          onOpenChange={(open) => !open && setEditingInteraction(null)}
          onSubmit={handleEditInteraction}
          customerId={editingInteraction?.customer_id || ""}
          initialData={editingInteraction}
          isEditing={true}
        />

        <DeleteConfirmDialog
          open={!!deletingInteraction}
          onOpenChange={(open) => !open && setDeletingInteraction(null)}
          onConfirm={handleDeleteInteraction}
          title="Delete Follow-up"
          description="Are you sure you want to delete this follow-up"
          itemName={deletingInteraction?.type}
        />
      </div>
    </CRMLayout>
  );
};

export default Followups;