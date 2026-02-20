// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuditLog
 * @dev Smart contract for immutable audit logging of EV Copilot agent decisions
 */
contract AuditLog {
    struct LogEntry {
        string agent;
        string stationId;
        string action;
        uint256 timestamp;
        string dataHash;
        address submitter;
    }

    // Storage
    LogEntry[] public logs;
    mapping(address => bool) public authorizedSubmitters;
    address public owner;
    uint256 public totalSubmissions;

    // Events
    event LogAdded(
        uint256 indexed logId,
        string indexed agent,
        string indexed stationId,
        string action,
        uint256 timestamp,
        string dataHash,
        address submitter
    );

    event SubmitterAuthorized(address indexed submitter);
    event SubmitterRevoked(address indexed submitter);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedSubmitters[msg.sender] || msg.sender == owner,
            "Not authorized to submit logs"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedSubmitters[msg.sender] = true;
        emit SubmitterAuthorized(msg.sender);
    }

    /**
     * @dev Add a new audit log entry
     * @param agent The agent that made the decision
     * @param stationId The station ID where the decision was made
     * @param action The action that was taken
     * @param dataHash The hash of the decision data
     */
    function addLog(
        string memory agent,
        string memory stationId,
        string memory action,
        string memory dataHash
    ) public onlyAuthorized {
        require(bytes(agent).length > 0, "Agent cannot be empty");
        require(bytes(stationId).length > 0, "Station ID cannot be empty");
        require(bytes(action).length > 0, "Action cannot be empty");
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");

        uint256 logId = logs.length;
        
        logs.push(LogEntry({
            agent: agent,
            stationId: stationId,
            action: action,
            timestamp: block.timestamp,
            dataHash: dataHash,
            submitter: msg.sender
        }));

        totalSubmissions++;

        emit LogAdded(
            logId,
            agent,
            stationId,
            action,
            block.timestamp,
            dataHash,
            msg.sender
        );
    }

    /**
     * @dev Get a specific log entry by ID
     * @param logId The ID of the log entry
     * @return The log entry details
     */
    function getLog(uint256 logId) public view returns (LogEntry memory) {
        require(logId < logs.length, "Log ID does not exist");
        return logs[logId];
    }

    /**
     * @dev Get the total number of logs
     * @return The total number of log entries
     */
    function totalLogs() public view returns (uint256) {
        return logs.length;
    }

    /**
     * @dev Get logs by agent
     * @param agent The agent name to filter by
     * @param offset The starting index
     * @param limit The maximum number of logs to return
     * @return An array of log entries
     */
    function getLogsByAgent(
        string memory agent,
        uint256 offset,
        uint256 limit
    ) public view returns (LogEntry[] memory) {
        require(limit > 0 && limit <= 100, "Limit must be between 1 and 100");
        
        LogEntry[] memory result = new LogEntry[](limit);
        uint256 count = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < logs.length && count < limit; i++) {
            if (keccak256(bytes(logs[i].agent)) == keccak256(bytes(agent))) {
                if (currentIndex >= offset) {
                    result[count] = logs[i];
                    count++;
                }
                currentIndex++;
            }
        }

        // Resize array to actual count
        LogEntry[] memory finalResult = new LogEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }

        return finalResult;
    }

    /**
     * @dev Get logs by station ID
     * @param stationId The station ID to filter by
     * @param offset The starting index
     * @param limit The maximum number of logs to return
     * @return An array of log entries
     */
    function getLogsByStation(
        string memory stationId,
        uint256 offset,
        uint256 limit
    ) public view returns (LogEntry[] memory) {
        require(limit > 0 && limit <= 100, "Limit must be between 1 and 100");
        
        LogEntry[] memory result = new LogEntry[](limit);
        uint256 count = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < logs.length && count < limit; i++) {
            if (keccak256(bytes(logs[i].stationId)) == keccak256(bytes(stationId))) {
                if (currentIndex >= offset) {
                    result[count] = logs[i];
                    count++;
                }
                currentIndex++;
            }
        }

        // Resize array to actual count
        LogEntry[] memory finalResult = new LogEntry[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }

        return finalResult;
    }

    /**
     * @dev Authorize a new submitter
     * @param submitter The address to authorize
     */
    function authorizeSubmitter(address submitter) public onlyOwner {
        require(submitter != address(0), "Invalid address");
        authorizedSubmitters[submitter] = true;
        emit SubmitterAuthorized(submitter);
    }

    /**
     * @dev Revoke submitter authorization
     * @param submitter The address to revoke
     */
    function revokeSubmitter(address submitter) public onlyOwner {
        require(submitter != owner, "Cannot revoke owner");
        authorizedSubmitters[submitter] = false;
        emit SubmitterRevoked(submitter);
    }

    /**
     * @dev Check if an address is authorized to submit logs
     * @param submitter The address to check
     * @return True if authorized, false otherwise
     */
    function isAuthorized(address submitter) public view returns (bool) {
        return authorizedSubmitters[submitter] || submitter == owner;
    }

    /**
     * @dev Get contract information
     * @return owner address, total logs, total submissions
     */
    function getContractInfo() public view returns (address, uint256, uint256) {
        return (owner, logs.length, totalSubmissions);
    }
}