import logging
import os

from pymongo import MongoClient
from pymongo.errors import PyMongoError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


logger = logging.getLogger(__name__)
mongo_uri = f'mongodb://{os.environ["MONGO_HOST"]}:{os.environ["MONGO_PORT"]}'
db = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)['test_db']


def todo_to_dict(document):
    return {'id': str(document['_id']), 'description': document['description']}


class TodoListView(APIView):
    def get(self, request):
        try:
            documents = db.todos.find({}, {'description': 1}).sort('_id', -1)
            return Response({'todos': [todo_to_dict(item) for item in documents]})
        except PyMongoError:
            logger.exception('Could not load TODOs from MongoDB')
            return Response(
                {'error': 'Could not load TODOs. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    def post(self, request):
        description = request.data.get('description') if hasattr(request.data, 'get') else None
        if not isinstance(description, str) or not description.strip():
            return Response(
                {'error': 'Description is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        description = description.strip()
        if len(description) > 500:
            return Response(
                {'error': 'Description must be 500 characters or fewer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = db.todos.insert_one({'description': description})
            return Response(
                {'todo': {'id': str(result.inserted_id), 'description': description}},
                status=status.HTTP_201_CREATED,
            )
        except PyMongoError:
            logger.exception('Could not save TODO to MongoDB')
            return Response(
                {'error': 'Could not save TODO. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

