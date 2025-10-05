// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MessagePortal - Simple on-chain message board
/// @notice Users can post short messages; each message stores sender, text, timestamp and like count.
contract MessagePortal {
    struct Message {
        address sender;
        string text;
        uint256 timestamp;
        uint256 likes;
    }

    event NewMessage(address indexed sender, string message, uint256 timestamp, uint256 index);
    event MessageLiked(address indexed liker, uint256 indexed index, uint256 newLikeCount);

    Message[] private _messages;

    mapping(uint256 => mapping(address => bool)) public liked; // messageIndex => user => liked

    uint256 public constant MAX_LENGTH = 280; // simple length limit

    /// @notice Post a new message
    /// @param text The message text (<= 280 chars recommended)
    function postMessage(string calldata text) external {
        require(bytes(text).length > 0, "Empty message");
        require(bytes(text).length <= MAX_LENGTH, "Message too long");
        _messages.push(Message({
            sender: msg.sender,
            text: text,
            timestamp: block.timestamp,
            likes: 0
        }));
        emit NewMessage(msg.sender, text, block.timestamp, _messages.length - 1);
    }

    /// @notice Like a message once per address
    function likeMessage(uint256 index) external {
        require(index < _messages.length, "Bad index");
        require(!liked[index][msg.sender], "Already liked");
        liked[index][msg.sender] = true;
        _messages[index].likes += 1;
        emit MessageLiked(msg.sender, index, _messages[index].likes);
    }

    /// @notice Return count of messages
    function totalMessages() external view returns (uint256) {
        return _messages.length;
    }

    /// @notice Get a single message
    function getMessage(uint256 index) external view returns (Message memory) {
        require(index < _messages.length, "Bad index");
        return _messages[index];
    }

    /// @notice Fetch a page of messages (simple pagination)
    function getMessages(uint256 offset, uint256 limit) external view returns (Message[] memory) {
        uint256 len = _messages.length;
        if (offset >= len) return new Message[](0);
        uint256 end = offset + limit;
        if (end > len) end = len;
        uint256 size = end - offset;
        Message[] memory page = new Message[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = _messages[offset + i];
        }
        return page;
    }
}
