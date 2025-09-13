import React, { useState, useEffect } from "react";
import { Dialog } from "./Dialog";
import { useI18n } from "../i18n";
import { UIAppState } from "../types";
import "./EditHistoryDialog.scss";

interface EditHistoryVersion {
  id: string;
  name: string;
  timestamp: number;
  data: string; // JSON stringified scene data
}

interface EditHistoryDialogProps {
  appState: UIAppState;
  setAppState: React.Component<any, UIAppState>["setState"];
  onLoadVersion: (data: string, versionId: string) => void;
  app: any; // App instance for tracking current editing version
}

export const EditHistoryDialog = ({
  appState,
  setAppState,
  onLoadVersion,
  app,
}: EditHistoryDialogProps) => {
  const { t } = useI18n();
  const [versions, setVersions] = useState<EditHistoryVersion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    loadVersionsFromStorage();
  }, []);

  const loadVersionsFromStorage = () => {
    try {
      const stored = localStorage.getItem("excalidraw-edit-history");
      if (stored) {
        const parsedVersions = JSON.parse(stored);
        setVersions(parsedVersions);
      }
    } catch (error) {
      console.error("Error loading edit history:", error);
    }
  };

  const saveVersionsToStorage = (newVersions: EditHistoryVersion[]) => {
    try {
      localStorage.setItem("excalidraw-edit-history", JSON.stringify(newVersions));
      setVersions(newVersions);
    } catch (error) {
      console.error("Error saving edit history:", error);
    }
  };

  const handleClose = () => {
    setAppState({ openDialog: null });
  };

  const handleVersionClick = (version: EditHistoryVersion) => {
    onLoadVersion(version.data, version.id);
    handleClose();
  };

  const handleRenameStart = (version: EditHistoryVersion) => {
    setEditingId(version.id);
    setEditingName(version.name);
  };

  const handleRenameSubmit = (id: string) => {
    const updatedVersions = versions.map(version =>
      version.id === id ? { ...version, name: editingName } : version
    );
    saveVersionsToStorage(updatedVersions);
    setEditingId(null);
    setEditingName("");
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDeleteVersion = (id: string) => {
    // Check if the version being deleted is currently being edited
    const isCurrentlyEditing = app?.isCurrentlyEditingVersion?.(id);
    
    const updatedVersions = versions.filter(version => version.id !== id);
    saveVersionsToStorage(updatedVersions);
    
    // If we deleted the currently editing version, return to welcome page
    if (isCurrentlyEditing) {
      app?.handleDeleteCurrentEditingVersion?.();
      handleClose(); // Close the dialog
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (appState.openDialog?.name !== "editHistory") {
    return null;
  }

  return (
    <Dialog onCloseRequest={handleClose} title="Edit History" size="regular">
      <div className="edit-history-dialog">
        {versions.length === 0 ? (
          <div className="edit-history-empty">
            <p>No edit history available yet.</p>
            <p>Changes will be automatically saved every 5 seconds.</p>
          </div>
        ) : (
          <div className="edit-history-list">
            {versions.map((version) => (
              <div key={version.id} className="edit-history-item">
                <div className="edit-history-item-content">
                  {editingId === version.id ? (
                    <div className="edit-history-rename">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameSubmit(version.id);
                          } else if (e.key === "Escape") {
                            handleRenameCancel();
                          }
                        }}
                        onBlur={() => handleRenameSubmit(version.id)}
                        autoFocus
                        className="edit-history-rename-input"
                      />
                    </div>
                  ) : (
                    <>
                      <div 
                        className="edit-history-name"
                        onClick={() => handleVersionClick(version)}
                      >
                        {version.name}
                      </div>
                      <div className="edit-history-timestamp">
                        {formatTimestamp(version.timestamp)}
                      </div>
                    </>
                  )}
                </div>
                <div className="edit-history-actions">
                  {editingId !== version.id && (
                    <>
                      <button
                        className="edit-history-rename-btn"
                        onClick={() => handleRenameStart(version)}
                        title="Rename"
                      >
                        ✏️
                      </button>
                      <button
                        className="edit-history-delete-btn"
                        onClick={() => handleDeleteVersion(version.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
};
