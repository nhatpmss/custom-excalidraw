import React, { useState, useEffect } from "react";
import { Dialog } from "./Dialog";
import { useI18n } from "../i18n";
import { UIAppState } from "../types";
import "./EditHistoryDialog.scss";
import { TrashIcon, createIcon, searchIcon } from "./icons";

// Create a simple edit icon
const EditIcon = createIcon(
  <path
    strokeWidth="1.5"
    stroke="currentColor"
    fill="none"
    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
  />,
  { width: 24, height: 24, fill: "none", strokeWidth: 1.5, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }
);

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
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleDeleteAll = () => {
    if (window.confirm("Are you sure you want to delete all edit history? This action cannot be undone.")) {
      // Check if any version being deleted is currently being edited
      const isEditingAnyVersion = versions.some(version => 
        app?.isCurrentlyEditingVersion?.(version.id)
      );
      
      // Clear all versions
      saveVersionsToStorage([]);
      
      // If we deleted the currently editing version, return to welcome page
      if (isEditingAnyVersion) {
        app?.handleDeleteCurrentEditingVersion?.();
        handleClose(); // Close the dialog
      }
    }
  };

  // Filter versions based on search term
  const filteredVersions = versions.filter(version =>
    version.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (appState.openDialog?.name !== "editHistory") {
    return null;
  }

  return (
    <Dialog onCloseRequest={handleClose} title="Edit History" size="regular">
      <div className="edit-history-dialog">
        {/* Search and controls section */}
        <div className="edit-history-controls">
          <div className="edit-history-search-container">
            <div className="edit-history-search-field">
              <label className="edit-history-search-label">
                Search versions
              </label>
              <div className="edit-history-search-input-wrapper">
                <div className="edit-history-search-icon">
                  {searchIcon}
                </div>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="edit-history-search-input"
                />
                {searchTerm && (
                  <button
                    className="edit-history-search-clear"
                    onClick={() => setSearchTerm("")}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
          {versions.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="edit-history-delete-all-button"
              title="Delete all versions"
            >
              Delete All
            </button>
          )}
        </div>

        <div className="edit-history-content">
          {versions.length === 0 ? (
            <div className="edit-history-empty">
              <p>No edit history available yet</p>
              <p>Use Cmd+S to save your work and create history versions</p>
            </div>
          ) : filteredVersions.length === 0 ? (
            <div className="edit-history-empty">
              <p>No versions found</p>
              <p>Try a different search term or clear the search</p>
            </div>
          ) : (
            <div className="edit-history-list">
              {filteredVersions.map((version) => (
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
                        title="Rename version"
                        aria-label="Rename version"
                      >
                        {EditIcon}
                      </button>
                      <button
                        className="edit-history-delete-btn"
                        onClick={() => handleDeleteVersion(version.id)}
                        title="Delete version"
                        aria-label="Delete version"
                      >
                        {TrashIcon}
                      </button>
                    </>
                  )}
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
