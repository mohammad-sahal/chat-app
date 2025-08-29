const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all groups for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId })
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar online')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, avatar, members, description } = req.body;

    // Validate required fields
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: 'Name and members array are required' });
    }

    // Check if all members exist
    const memberUsers = await User.find({ _id: { $in: members } });
    if (memberUsers.length !== members.length) {
      return res.status(400).json({ error: 'Some members do not exist' });
    }

    // Create group
    const group = new Group({
      name,
      avatar: avatar || '',
      description: description || '',
      admin: req.user.userId,
      members: [...members, req.user.userId]
    });

    await group.save();

    // Populate admin and members for response
    await group.populate('admin', 'username avatar');
    await group.populate('members', 'username avatar online');

    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific group
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar online');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === req.user.userId)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update group
router.put('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { name, avatar, description } = req.body;

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only admin can update group' });
    }

    // Update group
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (description !== undefined) updateData.description = description;

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.groupId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('admin', 'username avatar')
    .populate('members', 'username avatar online');

    res.json(updatedGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove member from group
router.delete('/:groupId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only admin can remove members' });
    }

    // Check if trying to remove admin
    if (req.params.memberId === req.user.userId) {
      return res.status(400).json({ error: 'Admin cannot remove themselves' });
    }

    // Remove member
    group.members = group.members.filter(
      member => member.toString() !== req.params.memberId
    );

    await group.save();

    // Populate for response
    await group.populate('admin', 'username avatar');
    await group.populate('members', 'username avatar online');

    res.json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add member to group
router.post('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const { memberId } = req.body;

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only admin can add members' });
    }

    // Check if member already exists
    if (group.members.includes(memberId)) {
      return res.status(400).json({ error: 'Member already in group' });
    }

    // Add member
    group.members.push(memberId);
    await group.save();

    // Populate for response
    await group.populate('admin', 'username avatar');
    await group.populate('members', 'username avatar online');

    res.json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
