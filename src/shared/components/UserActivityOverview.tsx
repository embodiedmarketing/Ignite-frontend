import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { format } from "date-fns";

interface UserStat {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  userEmail: string;
  loginCount: number;
  completedSections: number;
  totalResponses: number;
  lastLogin: string | null;
  completedSectionsList?: Array<{
    title: string;
    completedAt: string;
  }>;
  messagingStrategies?: Array<{
    id: number;
    title: string;
    version: number;
  }>;
  offerOutlines?: Array<{
    id: number;
    title: string;
    offerNumber: number;
  }>;
  salesPages?: Array<{
    id: number;
    draftNumber: number;
  }>;
  igniteDocs?: Array<{
    id: number;
    title: string;
    docType: string;
  }>;
}

interface UserActivityOverviewProps {
  userStats: UserStat[];
  MessagingStrategyButton: React.ComponentType<{ strategyId: number; title: string; version: number }>;
  OfferOutlineButton: React.ComponentType<{ outlineId: number; title: string; offerNumber: number }>;
  SalesPageButton: React.ComponentType<{ pageId: number; draftNumber: number }>;
  IgniteDocButton: React.ComponentType<{ docId: number; title: string; docType: string }>;
  onUserClick?: (userId: number) => void;
}

export default function UserActivityOverview({
  userStats,
  MessagingStrategyButton,
  OfferOutlineButton,
  SalesPageButton,
  IgniteDocButton,
  onUserClick,
}: UserActivityOverviewProps) {
  const handleUserClick = (userId: number) => {
    if (onUserClick) {
      onUserClick(userId);
    } else {
      window.location.href = `/admin/users/${userId}`;
    }
  };

  if (!userStats || userStats.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Activity Overview
        </CardTitle>
        <CardDescription>Detailed statistics for each user</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-slate-700">User</th>
                <th className="text-center p-3 font-medium text-slate-700">Logins</th>
                <th className="text-center p-3 font-medium text-slate-700">Sections</th>
                <th className="text-center p-3 font-medium text-slate-700">Responses</th>
                <th className="text-left p-3 font-medium text-slate-700">Completed Documents</th>
                <th className="text-right p-3 font-medium text-slate-700">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {userStats.map((stat) => (
                <tr
                  key={stat.userId}
                  className="hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => handleUserClick(stat.userId)}
                  data-testid={`user-row-${stat.userId}`}
                >
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {stat.firstName} {stat.lastName}
                      </p>
                      <p className="text-xs text-slate-600">{stat.userEmail}</p>
                      {stat.completedSectionsList && stat.completedSectionsList.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-slate-700">Completed Sections:</p>
                          <div className="flex flex-wrap gap-1">
                            {stat.completedSectionsList.map((section, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200"
                                title={`Completed: ${format(new Date(section.completedAt), 'MMM d, yyyy h:mm a')}`}
                              >
                                {section.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {stat.loginCount}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-700">{stat.completedSections}</td>
                  <td className="p-3 text-center text-slate-700">{stat.totalResponses}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      {stat.messagingStrategies && stat.messagingStrategies.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            Messaging Strategies ({stat.messagingStrategies.length})
                          </p>
                          {stat.messagingStrategies.map((strategy) => (
                            <div key={strategy.id} onClick={(e) => e.stopPropagation()}>
                              <MessagingStrategyButton
                                strategyId={strategy.id}
                                title={strategy.title}
                                version={strategy.version}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {stat.offerOutlines && stat.offerOutlines.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            Offer Outlines ({stat.offerOutlines.length})
                          </p>
                          {stat.offerOutlines.map((outline) => (
                            <div key={outline.id} onClick={(e) => e.stopPropagation()}>
                              <OfferOutlineButton
                                outlineId={outline.id}
                                title={outline.title}
                                offerNumber={outline.offerNumber}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {stat.salesPages && stat.salesPages.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            Sales Pages ({stat.salesPages.length})
                          </p>
                          {stat.salesPages.map((page) => (
                            <div key={page.id} onClick={(e) => e.stopPropagation()}>
                              <SalesPageButton pageId={page.id} draftNumber={page.draftNumber} />
                            </div>
                          ))}
                        </div>
                      )}
                      {stat.igniteDocs && stat.igniteDocs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            IGNITE Docs ({stat.igniteDocs.length})
                          </p>
                          {stat.igniteDocs.map((doc) => (
                            <div key={doc.id} onClick={(e) => e.stopPropagation()}>
                              <IgniteDocButton docId={doc.id} title={doc.title} docType={doc.docType} />
                            </div>
                          ))}
                        </div>
                      )}
                      {(!stat.messagingStrategies || stat.messagingStrategies.length === 0) &&
                        (!stat.offerOutlines || stat.offerOutlines.length === 0) &&
                        (!stat.salesPages || stat.salesPages.length === 0) &&
                        (!stat.igniteDocs || stat.igniteDocs.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No documents yet</p>
                        )}
                    </div>
                  </td>
                  <td className="p-3 text-right text-xs text-slate-600">
                    {stat.lastLogin ? format(new Date(stat.lastLogin), 'MMM d, yyyy h:mm a') : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

