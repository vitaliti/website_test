import { useEffect, useState } from "react";
import "./ReportModal.css";
import * as db from "../services/DatabaseService";

type ReportReason = {
    id: string;
    reason: string;
};

type ReportModalProps = {
    isOpen: boolean;
    userId: string;
    apartmentId: string;
    onClose: () => void;
    onReportSaved: () => void;
};

function ReportModal({
    isOpen,
    userId,
    apartmentId,
    onClose,
    onReportSaved
}: ReportModalProps) {
    const [reasons, setReasons] = useState<ReportReason[]>([]);
    const [reasonId, setReasonId] = useState("");
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        async function loadReasons() {
            const { data, error } = await db.getReportReasons("apartment");

            if (error) {
                console.error("Error loading report reasons:", error);
                return;
            }

            setReasons(data ?? []);
        }

        loadReasons();
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!reasonId) {
            return;
        }

        const { error } = await db.reportApartment(
            userId,
            apartmentId,
            reasonId,
            comment
        );

        if (error) {
            console.error("Error reporting apartment:", error);
            return;
        }

        setReasonId("");
        setComment("");
        onReportSaved();
        onClose();
    }

    function handleClose() {
        setReasonId("");
        setComment("");
        onClose();
    }

    return (
        <div className="report-modal-overlay" onClick={handleClose}>
            <div
                className="report-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <h2>Report apartment</h2>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="report-reason">
                        Reason
                    </label>

                    <select
                        id="report-reason"
                        value={reasonId}
                        onChange={(event) => setReasonId(event.target.value)}
                        required
                    >
                        <option value="">Select a reason</option>

                        {reasons.map((reason) => (
                            <option key={reason.id} value={reason.id}>
                                {reason.reason}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="report-comment">
                        Comment <span>(optional)</span>
                    </label>

                    <textarea
                        id="report-comment"
                        value={comment}
                        onChange={(event) => {
                            const lines = event.target.value.split("\n");

                            if (lines.length <= 15) {
                                setComment(event.target.value);
                            }
                        }}
                        placeholder="Add more information..."
                        rows={5}
                        maxLength={500}
                    />

                    <div className="report-modal-buttons">
                        <button
                            type="button"
                            className="report-cancel-button"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="report-submit-button"
                        >
                            Send report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReportModal;