const DataLoader = require('dataloader');
const { APIError } = require('../../utils/exception');
const UserSession = require('../../utils/userAuth/session');
const userModel = require('../user/user.model');
const CommentModel = require('./comment.model');

const findByID = () =>
  new DataLoader(
    async (ids) => {
      try {
        const _comments = await CommentModel.find({ _id: ids });

        const _returnComments = ids.map((id) => _comments.find((_comment) => _comment.id.toString() === id.toString()));
        return _returnComments;
      } catch (error) {
        throw APIError(null, error);
      }
    },
    {
      batchScheduleFn: (cb) => setTimeout(cb, 100),
    }
  );

const findAll = (offset, limit) => CommentModel.find().sort({ createdAt: 'desc' }).skip(offset).limit(limit);

const countNumberOfComments = (parentID, parentModel) =>
  CommentModel.countDocuments({
    'parent.reference': parentID,
    'parent.model': parentModel,
  });

const create = async (authorID, content, parentID, parentType, session, authToken, mid) => {
  try {
    const _author = await userModel.findById(authorID);
    if (!_author) {
      throw APIError('NOT FOUND', null, 'Invalid Author ID');
    }

    const [_comment] = await CommentModel.create([
      {
        content,
        author: {
          name: _author.fullName,
          reference: authorID,
        },
        parent: {
          reference: parentID,
          model: parentType,
        },
        createdBy: UserSession.valid(session, authToken) ? mid : null,
      },
    ]);

    return _comment;
  } catch (error) {
    throw APIError(null, error);
  }
};

const updateContent = async (id, content, session, authToken, mid) => {
  try {
    const _comment = await CommentModel.findByIdAndUpdate(
      id,
      {
        content,
        updatedBy: UserSession.valid(session, authToken) ? mid : null,
      },
      { new: true }
    );

    return _comment;
  } catch (error) {
    throw APIError(null, error);
  }
};

const remove = (id) => CommentModel.findByIdAndDelete(id);

const CommentDataSources = () => ({
  findAll,
  findByID: findByID(),
  countNumberOfComments,
  create,
  updateContent,
  remove,
});

module.exports = CommentDataSources;
