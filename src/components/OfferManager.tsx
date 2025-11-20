import { useState } from "react";
import { Plus, Trash2, Edit3, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useUserOffers,
  useCreateUserOffer,
  useUpdateUserOffer,
  useDeleteUserOffer,
  useSetActiveOffer,
} from "@/hooks/useUserOffers";

interface OfferManagerProps {
  userId: any;
  onOfferSelect?: (offer: any) => void;
}

interface OfferFormData {
  title: string;
  status: "draft" | "active" | "completed" | "archived";
  isActive: boolean;
}

export function OfferManager({ userId }: OfferManagerProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [formData, setFormData] = useState<OfferFormData>({
    title: "",
    status: "draft",
    isActive: false,
  });

  // Query hooks
  const { data: offers = [], isLoading, refetch } = useUserOffers(userId);
  const createOfferMutation = useCreateUserOffer();
  const updateOfferMutation = useUpdateUserOffer();
  const deleteOfferMutation = useDeleteUserOffer();
  const setActiveOfferMutation = useSetActiveOffer();

  const resetForm = () => {
    setFormData({
      title: "",
      status: "draft",
      isActive: false,
    });
    setEditingOffer(null);
  };

  const handleCreateOffer = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an offer title",
        variant: "destructive",
      });
      return;
    }

    try {
      await createOfferMutation.mutateAsync({
        userId,
        title: formData.title.trim(),
        status: formData.status,
        isActive: formData.isActive,
      });

      toast({
        title: "Success",
        description: "Offer created successfully",
      });

      setCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create offer",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOffer = async () => {
    if (!editingOffer || !formData.title.trim()) return;

    try {
      await updateOfferMutation.mutateAsync({
        id: editingOffer.id,
        updates: {
          title: formData.title.trim(),
          status: formData.status,
          isActive: formData.isActive,
        },
      });

      toast({
        title: "Success",
        description: "Offer updated successfully",
      });

      resetForm();
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    try {
      await deleteOfferMutation.mutateAsync(offerId);
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    }
  };

  const handleSetActive = async (offerId: number) => {
    try {
      await setActiveOfferMutation.mutateAsync({ userId, offerId });
      toast({
        title: "Success",
        description: "Active offer updated",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set active offer",
        variant: "destructive",
      });
    }
  };

  const handleEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      status: offer.status as "draft" | "active" | "completed" | "archived",
      isActive: offer.isActive,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Your Offers</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="bg-[#f5a89f] hover:bg-[#f5a89f]/90 text-white border-0 flex-shrink-0 min-w-max px-4 py-2 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Offer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Offer Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter offer title..."
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <Label htmlFor="isActive">Set as active offer</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOffer}
                disabled={createOfferMutation.isPending}
                className="bg-[#f5a89f] hover:bg-[#f5a89f]/90 text-white"
              >
                {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                You haven't created any offers yet
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Offer
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer: any) => (
            <Card
              key={offer.id}
              className={offer.isActive ? "ring-2 ring-coral" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{offer.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {offer.isActive && (
                      <CheckCircle className="w-5 h-5 text-coral" />
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOffer(offer)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Offer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-title">Offer Title</Label>
                            <Input
                              id="edit-title"
                              value={formData.title}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value: any) =>
                                setFormData({ ...formData, status: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="archived">
                                  Archived
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="edit-isActive"
                              checked={formData.isActive}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  isActive: e.target.checked,
                                })
                              }
                            />
                            <Label htmlFor="edit-isActive">
                              Set as active offer
                            </Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateOffer}
                            disabled={updateOfferMutation.isPending}
                            className="bg-coral hover:bg-coral/90"
                          >
                            {updateOfferMutation.isPending
                              ? "Updating..."
                              : "Update Offer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{offer.title}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {offer.status}
                    </Badge>
                    {offer.isActive && (
                      <Badge className="bg-coral text-white">
                        Currently Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(offer.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() => handleSetActive(offer.id)}
                    variant={offer.isActive ? "outline" : "default"}
                    size="sm"
                    className={
                      offer.isActive
                        ? "bg-green-500 hover:bg-green-500 text-white font-semibold w-full border-0"
                        : "bg-yellow-400 hover:bg-yellow-500 text-black font-semibold w-full"
                    }
                    disabled={offer.isActive}
                  >
                    {offer.isActive ? "Currently Active" : "Work on This Offer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default OfferManager;
